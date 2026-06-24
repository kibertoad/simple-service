# in-memory-resource-service — Requirements

> Generated, prescriptive requirements for this service (what MUST be
> true). Read this first. `rules.md` lists cross-cutting invariants;
> `features/*.feature` are the acceptance scenarios your work must satisfy.

A transient, in-memory REST service managing multiple resource collections: Users, Organizations, Buildings, Cars, Bicycles, and Office Tables. Each resource type supports create/get/list/update/delete operations, uses system-generated identifiers, enforces simple per-resource domain validation, and persists only for the lifetime of the process.

## User Management

Capabilities for creating and fully replacing User resources with a fixed id/name/email schema, UUID generation, and email uniqueness enforced in an in-memory store.

- **Create User endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that creates a User from a supplied name and email.
  - _Given_ a creation request containing valid values for name and email _When_ the request is processed _Then_ a new User is persisted with a system-generated UUID as its id, and a success response is returned
  - _Given_ a creation request that does not include a name _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that does not include an email _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that includes an email already held by a persisted User _When_ the request is processed _Then_ the system rejects the request to preserve email uniqueness
  - _Given_ a creation request that includes extra fields beyond name and email _When_ the request is processed _Then_ the persisted User contains only id, name, and email; any additional fields are discarded
- **Replace User endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that fully replaces an existing persisted User with a complete User record.
  - _Given_ an existing User and a replace request containing a complete User record including id, name, and email _When_ the request is processed _Then_ the stored User is fully replaced with the supplied record, and a success response is returned
  - _Given_ a replace request referencing an id that does not identify any persisted User _When_ the request is processed _Then_ the system rejects the request because the target User does not exist
  - _Given_ a replace request for an existing User where the request body is missing name, email, or id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request where the id in the request body does not match the targeted User's id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request for an existing User that repeats the User's own current email _When_ the request is processed _Then_ the replacement succeeds and the User remains uniquely represented
  - _Given_ a replace request for an existing User that specifies an email already held by a different User _When_ the request is processed _Then_ the system rejects the request to preserve email uniqueness
  - _Given_ a replace request for an existing User that includes extra fields beyond id, name, and email _When_ the request is processed _Then_ the persisted User contains only id, name, and email; any additional fields are discarded
- **UUID identifier generation** _(must, functional)_ — The system SHALL generate a UUID for the User id upon creation and SHALL NOT allow clients to supply or modify it.
  - _Given_ a User creation request _When_ the system persists the User _Then_ the id value is a valid, system-generated UUID
  - _Given_ two independent User creation requests _When_ both Users are persisted _Then_ each User is assigned a distinct id
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUID
  - _Given_ an existing User _When_ a replace request is processed _Then_ the User's id remains unchanged from the value assigned at creation
- **Email uniqueness** _(must, functional)_ — The system SHALL enforce that the email field is unique across all persisted Users for both creation and replacement operations.
  - _Given_ a User already exists with a specific email address _When_ a creation request specifies that same email _Then_ the system rejects the request
  - _Given_ a User already exists with a specific email address _When_ a replace request for a different User specifies that same email _Then_ the system rejects the request
  - _Given_ a User already exists with a specific email address _When_ a replace request for that same User repeats the current email _Then_ the replacement succeeds and uniqueness is maintained
  - _Given_ no persisted User has a specific email address _When_ a creation or replace request specifies that email _Then_ the operation succeeds and the new email is stored
- **User representation** _(must, functional)_ — The system SHALL represent a User with exactly the fields id, name, and email, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted User _When_ the record is inspected _Then_ it contains exactly the fields id, name, and email
  - _Given_ a User has been created or replaced _When_ the persisted record is retrieved _Then_ no extra computed or metadata fields are present beyond id, name, and email
- **In-memory persistence** _(must, functional)_ — The system SHALL use an in-memory store for all User persistence.
  - _Given_ a User has been persisted _When_ the running process serves subsequent requests _Then_ the User record remains available and can be replaced within the same process instance
  - _Given_ a User has been persisted _When_ the process is restarted _Then_ the previously persisted User records are no longer present

## Bear CRUD

Capabilities for creating, reading, listing, updating, and deleting Bear resources with id/name/age/colour schema, UUIDv7 generation, validation rules for name and age, freeform colour, and cursor-based pagination backed by in-memory storage.

- **Create Bear** _(must, functional)_ — The system SHALL create a bear record from a client-provided name, age, and colour, assigning a service-generated UUIDv7 identifier and returning the complete record.
  - _Given_ a non-empty, unique name no longer than 100 characters that also satisfies applicable character/pattern restrictions, a non-negative integer age, and a freeform colour _When_ a create request is submitted _Then_ the system stores the bear and returns the record including the generated UUIDv7 identifier
  - _Given_ a create request with an empty name _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that exceeds 100 characters _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that duplicates an existing bear name _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a name that violates applicable character/pattern restrictions _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with a negative age _When_ the request is submitted _Then_ the system rejects the request
  - _Given_ a create request with an age that is not an integer _When_ the request is submitted _Then_ the system rejects the request
- **Read Bear** _(must, functional)_ — The system SHALL retrieve a single bear by its UUIDv7 identifier.
  - _Given_ a bear exists with a known UUIDv7 identifier _When_ a read request is made for that identifier _Then_ the system returns the corresponding bear record
  - _Given_ a read request for a UUIDv7 identifier that does not exist _When_ the request is made _Then_ the system indicates that the bear was not found
- **List Bears** _(must, functional)_ — The system SHALL list all stored bears using cursor-based pagination.
  - _Given_ one or more bears exist in storage _When_ a list request is made _Then_ the system returns a paginated result set using cursor-based pagination
  - _Given_ no bears exist _When_ a list request is made _Then_ the system returns an empty paginated result set
- **Update Bear** _(must, functional)_ — The system SHALL update an existing bear, identified by UUIDv7, by fully replacing its mutable fields (name, age, colour).
  - _Given_ an existing bear and a replacement representation that satisfies all creation validation rules _When_ an update request is submitted _Then_ the system overwrites the bear's mutable fields and returns the updated record
  - _Given_ an update request with an invalid age _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request with a duplicate name _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request with an empty name _When_ the request is submitted _Then_ the system rejects the update
  - _Given_ an update request that omits one or more mutable fields _When_ the request is submitted _Then_ the system applies full replacement semantics and stores exactly the provided values
- **Delete Bear** _(must, functional)_ — The system SHALL delete a bear by its UUIDv7 identifier.
  - _Given_ an existing bear _When_ a delete request is made by identifier _Then_ the system removes the bear from storage
  - _Given_ a delete request for a UUIDv7 identifier that does not exist _When_ the request is made _Then_ the system indicates that the bear was not found
- **Bear in-memory persistence** _(must, functional)_ — The system SHALL retain all bear records in volatile, in-memory storage with no persistence across process restarts.
  - _Given_ bears have been created in the service _When_ the service process restarts _Then_ no bear records remain
- **In-memory operation latency** _(should, functional)_ — The system SHALL process all CRUD operations with latency consistent with in-memory data access and without reliance on external persistence services.
  - _Given_ bear CRUD operations are executed _When_ the system processes them _Then_ responses are produced without reliance on external persistence services and with latency consistent with in-memory access
- **Local UUIDv7 generation** _(should, functional)_ — The system SHALL generate UUIDv7 identifiers using only local runtime capabilities.
  - _Given_ the service generates a bear identifier _When_ identifier generation occurs _Then_ the identifier is produced using only local runtime capabilities without depending on external network services

## Organization Management

Capabilities for creating and fully replacing Organization resources with a fixed id/name/slug schema, UUID generation, and slug uniqueness enforced in an in-memory store.

- **Create Organization endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that creates an Organization from a supplied name and slug.
  - _Given_ a creation request containing valid values for name and slug _When_ the request is processed _Then_ a new Organization is persisted with a system-generated UUID as its id, and a success response is returned
  - _Given_ a creation request that does not include a name _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that does not include a slug _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that includes a slug already held by a persisted Organization _When_ the request is processed _Then_ the system rejects the request to preserve slug uniqueness
  - _Given_ a creation request that includes a slug not matching the required lowercase-alphanumeric-hyphen format _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a creation request that includes extra fields beyond name and slug _When_ the request is processed _Then_ the persisted Organization contains only id, name, and slug; any additional fields are discarded
- **Replace Organization endpoint** _(must, functional)_ — The system SHALL expose a REST endpoint that fully replaces an existing persisted Organization with a complete Organization record.
  - _Given_ an existing Organization and a replace request containing a complete Organization record including id, name, and slug _When_ the request is processed _Then_ the stored Organization is fully replaced with the supplied record, and a success response is returned
  - _Given_ a replace request referencing an id that does not identify any persisted Organization _When_ the request is processed _Then_ the system rejects the request because the target Organization does not exist
  - _Given_ a replace request for an existing Organization where the request body is missing id, name, or slug _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request where the id in the request body does not match the targeted Organization's id _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request for an existing Organization that repeats the Organization's own current slug _When_ the request is processed _Then_ the replacement succeeds and slug uniqueness is maintained
  - _Given_ a replace request for an existing Organization that specifies a slug already held by a different Organization _When_ the request is processed _Then_ the system rejects the request to preserve slug uniqueness
  - _Given_ a replace request for an existing Organization that includes a slug not matching the required lowercase-alphanumeric-hyphen format _When_ the request is processed _Then_ the system rejects the request as invalid
  - _Given_ a replace request for an existing Organization that includes extra fields beyond id, name, and slug _When_ the request is processed _Then_ the persisted Organization contains only id, name, and slug; any additional fields are discarded
- **Organization UUID identifier generation** _(must, functional)_ — The system SHALL generate a UUID for the Organization id upon creation and SHALL NOT allow clients to supply or modify it.
  - _Given_ an Organization creation request _When_ the system persists the Organization _Then_ the id value is a valid, system-generated UUID
  - _Given_ two independent Organization creation requests _When_ both Organizations are persisted _Then_ each Organization is assigned a distinct id
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUID
  - _Given_ an existing Organization _When_ a replace request is processed _Then_ the Organization's id remains unchanged from the value assigned at creation
- **Slug uniqueness** _(must, functional)_ — The system SHALL enforce that the slug field is unique across all persisted Organizations for both creation and replacement operations.
  - _Given_ an Organization already exists with a specific slug _When_ a creation request specifies that same slug _Then_ the system rejects the request
  - _Given_ an Organization already exists with a specific slug _When_ a replace request for a different Organization specifies that same slug _Then_ the system rejects the request
  - _Given_ an Organization already exists with a specific slug _When_ a replace request for that same Organization repeats the current slug _Then_ the replacement succeeds and uniqueness is maintained
  - _Given_ no persisted Organization has a specific slug _When_ a creation or replace request specifies that slug _Then_ the operation succeeds and the new slug is stored
- **Organization representation** _(must, functional)_ — The system SHALL represent an Organization with exactly the fields id, name, and slug, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted Organization _When_ the record is inspected _Then_ it contains exactly the fields id, name, and slug
  - _Given_ an Organization has been created or replaced _When_ the persisted record is retrieved _Then_ no extra computed or metadata fields are present beyond id, name, and slug
- **Organization in-memory persistence** _(must, functional)_ — The system SHALL use an in-memory store for all Organization persistence.
  - _Given_ an Organization has been persisted _When_ the running process serves subsequent requests _Then_ the Organization record remains available and can be replaced within the same process instance
  - _Given_ an Organization has been persisted _When_ the process is restarted _Then_ the previously persisted Organization records are no longer present

## Building Management

Capabilities for creating, retrieving, updating, deleting, and listing Building resources with unique identifiers, name and address fields, and cursor-based pagination over a transient in-memory store.

- **Create Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to create an office building from a name and an address.
  - _Given_ a creation request containing a name not exceeding 80 characters and an address not exceeding 160 characters _When_ the request is processed _Then_ the system stores the Building with a unique identifier and returns the Building record
  - _Given_ a creation request containing a name exceeding 80 characters _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
  - _Given_ a creation request containing an address exceeding 160 characters _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
  - _Given_ a creation request containing a missing name or address _When_ the request is processed _Then_ the system performs basic error handling and does not create the Building
- **Retrieve Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to retrieve an office building by its unique identifier.
  - _Given_ a Building exists for the provided identifier _When_ the request is processed _Then_ the system returns the Building record
  - _Given_ no Building exists for the provided identifier _When_ the request is processed _Then_ the system performs basic error handling
- **Update Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to update an existing office building.
  - _Given_ a stored Building and a request containing a name not exceeding 80 characters and an address not exceeding 160 characters _When_ the request is processed _Then_ the system modifies the record and returns the updated Building
  - _Given_ no Building exists for the provided identifier _When_ an update request is processed _Then_ the system performs basic error handling
  - _Given_ an update request containing a name exceeding 80 characters _When_ the request is processed _Then_ the system performs basic error handling and does not modify the Building
  - _Given_ an update request containing an address exceeding 160 characters _When_ the request is processed _Then_ the system performs basic error handling and does not modify the Building
- **Delete Building endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to permanently delete an office building by its unique identifier.
  - _Given_ a stored Building _When_ a delete request is processed _Then_ the system permanently removes the record from the in-memory store
  - _Given_ no Building exists for the provided identifier _When_ a delete request is processed _Then_ the system performs basic error handling
- **List Buildings endpoint** _(must, functional)_ — The system SHALL expose a REST API endpoint to list office buildings with cursor-based pagination.
  - _Given_ zero stored buildings _When_ the list endpoint is invoked _Then_ the system returns a paginated collection with no items
  - _Given_ fewer buildings than the page size _When_ the list endpoint is invoked _Then_ the system returns all buildings and a pagination response indicating no next cursor
  - _Given_ more buildings than the page size _When_ the list endpoint is invoked with a page size parameter _Then_ the system returns a single page of buildings and a next cursor for retrieving subsequent buildings
  - _Given_ a valid next cursor from a previous list response _When_ the list endpoint is invoked with that cursor _Then_ the system returns the next page of buildings
- **Building representation** _(must, functional)_ — The system SHALL represent a Building with exactly the fields id, name, and address, and SHALL NOT persist additional fields supplied by clients.
  - _Given_ any persisted Building _When_ the record is inspected _Then_ it contains exactly the fields id, name, and address
- **Building in-memory persistence** _(must, nonfunctional)_ — The system SHALL store all Building data in memory only, without disk persistence, snapshotting, or file-based survival, and SHALL initialize the store empty on startup.
  - _Given_ a Building has been persisted _When_ the process is restarted _Then_ no Building data from the previous process lifecycle remains
  - _Given_ the service has just started _When_ the Building store is inspected _Then_ the store contains no seed data

## Car Management

Capabilities for typical CRUD operations on Car resources using a transient in-memory store.

- **Car CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints to create, retrieve, list, update, and delete Car resources, using an in-memory store.
  - _Given_ a valid create request for a Car _When_ the request is processed _Then_ the Car is persisted with a system-generated unique identifier and returned
  - _Given_ a stored Car and a valid identifier _When_ the retrieve request is processed _Then_ the system returns the Car record
  - _Given_ a Car identifier that does not exist _When_ the retrieve request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ one or more stored Cars and a list request _When_ the request is processed _Then_ the system returns a collection of Car records with cursor-based pagination
  - _Given_ a stored Car and a valid full-update request _When_ the request is processed _Then_ the system replaces the stored Car fields and returns the updated record
  - _Given_ a non-existent Car identifier on update _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ a stored Car identifier _When_ the delete request is processed _Then_ the system permanently removes the Car from the in-memory store
  - _Given_ a non-existent Car identifier on delete _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
- **Car identifier and representation** _(must, functional)_ — The system SHALL generate a unique identifier for each Car upon creation and represent a Car with a fixed set of fields.
  - _Given_ a Car creation request _When_ the Car is persisted _Then_ the id value is a valid, system-generated identifier
  - _Given_ two independent Car creation requests _When_ both Cars are persisted _Then_ each Car is assigned a distinct id
  - _Given_ any persisted Car _When_ the record is inspected _Then_ it contains the expected fixed fields and no extra computed fields
- **Car in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist all Car data in memory only, with an empty store on startup and no data survival across restarts.
  - _Given_ a Car has been persisted _When_ the process is restarted _Then_ no Car data from the previous process lifecycle remains

## Bicycle Management

Capabilities for typical CRUD operations on Bicycle resources using a transient in-memory store.

- **Bicycle CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints to create, retrieve, list, update, and delete Bicycle resources, using an in-memory store.
  - _Given_ a valid create request for a Bicycle _When_ the request is processed _Then_ the Bicycle is persisted with a system-generated unique identifier and returned
  - _Given_ a stored Bicycle and a valid identifier _When_ the retrieve request is processed _Then_ the system returns the Bicycle record
  - _Given_ a Bicycle identifier that does not exist _When_ the retrieve request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ one or more stored Bicycles and a list request _When_ the request is processed _Then_ the system returns a collection of Bicycle records with cursor-based pagination
  - _Given_ a stored Bicycle and a valid full-update request _When_ the request is processed _Then_ the system replaces the stored Bicycle fields and returns the updated record
  - _Given_ a non-existent Bicycle identifier on update _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
  - _Given_ a stored Bicycle identifier _When_ the delete request is processed _Then_ the system permanently removes the Bicycle from the in-memory store
  - _Given_ a non-existent Bicycle identifier on delete _When_ the request is processed _Then_ the system performs error handling indicating the resource was not found
- **Bicycle identifier and representation** _(must, functional)_ — The system SHALL generate a unique identifier for each Bicycle upon creation and represent a Bicycle with a fixed set of fields.
  - _Given_ a Bicycle creation request _When_ the Bicycle is persisted _Then_ the id value is a valid, system-generated identifier
  - _Given_ two independent Bicycle creation requests _When_ both Bicycles are persisted _Then_ each Bicycle is assigned a distinct id
  - _Given_ any persisted Bicycle _When_ the record is inspected _Then_ it contains the expected fixed fields and no extra computed fields
- **Bicycle in-memory persistence** _(must, nonfunctional)_ — The system SHALL persist all Bicycle data in memory only, with an empty store on startup and no data survival across restarts.
  - _Given_ a Bicycle has been persisted _When_ the process is restarted _Then_ no Bicycle data from the previous process lifecycle remains

## Office Table Management

Capabilities for creating, retrieving, listing, updating, and deleting physical office furniture (office table) resources with UUIDv7 identifiers, non-negative price validation, fixed id/price/date-bought representation, full-replacement updates, direct JSON payloads, cursor-based pagination, and no API version prefixes.

- **Office Table CRUD endpoints** _(must, functional)_ — The system SHALL expose REST endpoints for Create, Read, Update, and Delete operations on office table resources; exact URL paths SHALL be determined at implementation time.
  - _Given_ the service is running _When_ its API is inspected _Then_ it exposes RESTful endpoints supporting all CRUD operations for office tables
- **Office Table representation** _(must, functional)_ — The system SHALL represent each office table resource with the fields id, price, and date bought, generating id as a UUIDv7 upon creation.
  - _Given_ a request to create an office table _When_ the resource is created _Then_ the system assigns a UUIDv7 identifier and stores the provided price and date bought
  - _Given_ any stored office table _When_ retrieved _Then_ its JSON representation contains id, price, and date bought
  - _Given_ a creation request that includes a client-supplied id _When_ the request is processed _Then_ the system ignores the supplied id and assigns its own UUIDv7 identifier
- **Office Table price validation** _(must, functional)_ — The system SHALL reject any create or update request that specifies a negative price.
  - _Given_ a request payload with a negative price _When_ the create endpoint processes the request _Then_ the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource
  - _Given_ a request payload with a negative price for an existing office table _When_ the update endpoint processes the request _Then_ the system returns an HTTP status code consistent with common REST conventions indicating a client validation error and does not persist the invalid resource
  - _Given_ a request payload with a zero price _When_ the create or update endpoint processes the request _Then_ the operation succeeds because zero is a non-negative price
- **Retrieve Office Table endpoint** _(must, functional)_ — The system SHALL provide an endpoint to retrieve a single office table by its UUIDv7 identifier.
  - _Given_ an existing office table UUIDv7 identifier _When_ the retrieve endpoint is invoked _Then_ the system returns the resource directly as JSON with an HTTP status code consistent with common REST conventions for a successful retrieval
  - _Given_ a non-existent UUIDv7 identifier _When_ the retrieve endpoint is invoked _Then_ the system returns an HTTP status code consistent with common REST conventions indicating the resource was not found
- **List Office Tables endpoint** _(must, functional)_ — The system SHALL provide an endpoint to list office tables with cursor-based pagination.
  - _Given_ multiple office tables exist in the store _When_ the list endpoint is invoked _Then_ the system returns a paginated collection directly as JSON using cursor-based pagination
- **Office Table full replacement update** _(must, functional)_ — The system SHALL support only full resource replacement for updates.
  - _Given_ an existing office table _When_ an update request is received with a payload _Then_ the system replaces all stored fields with the payload contents and returns the updated resource
- **Direct JSON payloads** _(must, functional)_ — The system SHALL return resource and collection payloads directly as JSON without an envelope wrapper, using HTTP status codes consistent with common REST conventions.
  - _Given_ any successful CRUD operation for office tables _When_ the response is returned _Then_ the body contains the resource or collection directly without a data envelope
- **Office Table in-memory persistence** _(must, functional)_ — The system SHALL persist office table resources in a fully ephemeral in-memory store that is cleared on service restart.
  - _Given_ the service has stored office tables _When_ the service process restarts _Then_ no office table data from the previous process lifecycle remains
- **No API version prefixes** _(must, functional)_ — The system SHALL NOT include API version prefixes in endpoint URLs.
  - _Given_ any endpoint URL for office tables _When_ inspected _Then_ it does not contain a version path segment such as /v1/
- **Office Table REST interface conventions** _(must, nonfunctional)_ — The system SHALL expose a REST interface for office tables following common HTTP and REST conventions.
  - _Given_ a valid request to an office table endpoint using the HTTP method associated with the requested operation _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions for that operation
  - _Given_ a request to an office table endpoint using an HTTP method not supported by that endpoint _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions indicating the method is not allowed
  - _Given_ an invalid request payload for an office table create or update operation _When_ the request is processed _Then_ the response uses an HTTP status code consistent with common REST conventions indicating a client validation error
- **Office Table in-memory response times** _(must, nonfunctional)_ — The system SHALL use an in-memory store with response times characteristic of in-memory data access for all Office Table CRUD operations.
  - _Given_ the in-memory store contains office table data _When_ any CRUD operation is performed _Then_ the operation completes without disk I/O or durable storage access
  - _Given_ the service is processing office table requests _When_ response times are observed _Then_ CRUD operations complete within a timeframe characteristic of in-memory data access
